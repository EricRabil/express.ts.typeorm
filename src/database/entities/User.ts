import { BaseEntity, Entity, PrimaryColumn, Column, ObjectIdColumn } from "typeorm";
import { Security } from "../../util";
import bcrypt from "bcrypt";

@Entity()
export class User extends BaseEntity {
    @ObjectIdColumn()
    public id: any;

    @PrimaryColumn({unique: true})
    public snowflake: string;

    @Column({unique: true})
    public username: string;

    @Column({nullable: true, default: null})
    public password: string | null;

    @Column({nullable: false})
    public salt: string;

    /**
     * Generates a new salt for this user. Does not save.
     */
    public async newSalt(): Promise<void> {
        this.salt = await Security.random(64);
    }

    /**
     * Generates a new snowflake for this user. Does not save.
     */
    public async newSnowflake(): Promise<void> {
        this.snowflake = await Security.snowflake();
    }

    /**
     * Sets a new password for this user. Does not save.
     * @param password the new password
     */
    public async setPassword(password: string): Promise<void> {
        this.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    }

    /**
     * Returns whether a given password matches this user
     * @param password 
     */
    public async passwordMatches(password: string): Promise<boolean> {
        if (!this.password) {
            return false;
        }
        return await bcrypt.compare(password, this.password);
    }

    /**
     * Creates a token for this user
     */
    public token(): Promise<string> {
        return Security.Token.createToken(this);
    }

    /**
     * Get a user with the given token
     * @param token the token
     */
    public static findByToken(token: string): Promise<User | null> {
        return Security.Token.getUser(token);
    }

    public static async createUser(username: string, password: string): Promise<User> {
        const user = User.create();
        user.username = username;
        await Promise.all([user.newSalt(), user.newSnowflake(), user.setPassword(password)]);
        await user.save();
        return user;
    }
}